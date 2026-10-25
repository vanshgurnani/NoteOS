import json
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from ..config import settings
from ..auth import user_from_token
from ..database import notes_collection
from ..rag.providers import generate_chat_completion
from ..rag.retriever import index_note
from ..rag.cache import invalidate_user_rag_cache
from ..serializers import serialize_note

router = APIRouter()
log = logging.getLogger(__name__)

def make_summary(transcript, title):
    messages = [
        {"role": "system", "content": "Return only JSON with overview, key_points, decisions, action_items (task, owner, due_date), follow_ups. Never invent facts; unknown values are null."},
        {"role": "user", "content": "Meeting: " + title + "\nTranscript:\n" + transcript[-90000:]},
    ]
    raw = generate_chat_completion(messages)
    try:
        return json.loads(raw[raw.find("{"):raw.rfind("}")+1])
    except Exception:
        return {"overview": raw, "key_points": [], "decisions": [], "action_items": [], "follow_ups": []}

@router.websocket("/meetings/live")
async def live_meeting(websocket: WebSocket, token: str = ""):
    await websocket.accept()
    try:
        if not token:
            await websocket.send_json({"type":"error","message":"NOTE OS token required"})
            await websocket.close(code=4401)
            return
        try:
            user = user_from_token(token)
        except Exception:
            await websocket.send_json({"type":"error","message":"Invalid or expired NOTE OS session"})
            await websocket.close(code=4401)
            return
        title = "Google Meet " + datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
        lines, note_id = [], None
        await websocket.send_json({"type":"ready"})
        while True:
            event = await websocket.receive_json()
            kind = event.get("type")
            if kind == "start":
                title = str(event.get("title") or title)[:160]
                now = datetime.now(timezone.utc)
                note = {"title":title,"content":"## Live transcript\n\n_Capturing captions…_","category":"Work","icon":"🎙️","parent_id":None,"source_url":event.get("meeting_url"),"inbox":False,"tags":["meeting","google-meet"],"owner_id":user["_id"],"bookmarked":False,"pinned":False,"version":1,"created_at":now,"updated_at":now}
                note_id = notes_collection().insert_one(note).inserted_id
                await websocket.send_json({"type":"started","note_id":str(note_id)})
            elif kind == "caption":
                text = str(event.get("text") or "").strip()[:2000]
                if text and (not lines or lines[-1] != text):
                    lines.append(text)
                if note_id:
                    notes_collection().update_one({"_id":note_id,"owner_id":user["_id"]},{"$set":{"content":"## Live transcript\n\n"+"\n".join(lines)[-95000:],"updated_at":datetime.now(timezone.utc)},"$inc":{"version":1}})
                await websocket.send_json({"type":"transcript_ack","lines":len(lines)})
            elif kind == "stop":
                if not note_id or not lines:
                    await websocket.send_json({"type":"error","message":"No transcript captured. Enable Meet captions first."})
                    continue
                transcript = "\n".join(lines)
                await websocket.send_json({"type":"summarizing"})
                summary = make_summary(transcript,title)
                content = "## Summary\n\n"+str(summary.get("overview",""))+"\n\n### Key points\n"+"\n".join("- "+str(x) for x in summary.get("key_points",[]))+"\n\n### Decisions\n"+"\n".join("- "+str(x) for x in summary.get("decisions",[]))+"\n\n### Action items\n"+"\n".join("- [ ] "+str(x.get("task",""))+" — "+str(x.get("owner") or "Owner TBD")+" — "+str(x.get("due_date") or "Date TBD") for x in summary.get("action_items",[]) if isinstance(x,dict))+"\n\n### Follow-ups\n"+"\n".join("- "+str(x) for x in summary.get("follow_ups",[]))+"\n\n---\n\n## Transcript\n\n"+transcript
                now = datetime.now(timezone.utc)
                notes_collection().update_one({"_id":note_id,"owner_id":user["_id"]},{"$set":{"content":content[:100000],"meeting_summary":summary,"updated_at":now},"$inc":{"version":1}})
                try:
                    index_note(note_id=str(note_id),owner_id=str(user["_id"]),title=title,content=content,category="Work",tags=["meeting","google-meet"])
                    invalidate_user_rag_cache(str(user["_id"]))
                except Exception:
                    log.exception("Meeting note indexing failed")
                saved = notes_collection().find_one({"_id":note_id})
                await websocket.send_json({"type":"completed","note":serialize_note(saved),"summary":summary})
                break
            elif kind == "ping":
                await websocket.send_json({"type":"pong"})
    except WebSocketDisconnect:
        log.info("Meet caption stream disconnected")
