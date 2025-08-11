import socketio
from utils.user import AuthService
from utils.auth import get_current_user,make_room_id
from socketio import AsyncNamespace
from utils.logger import setup_logger

logger = setup_logger("socket")


class UsersNamespace(socketio.AsyncNamespace, AuthService):
    def __init__(self, namespace, user_service: AuthService):
        super().__init__(namespace)
        self.user_service = user_service

    async def on_connect(self, sid, environ):
        logger.info(f"[Users] Connected: {sid}")

    async def on_join_respective(self, sid, data):
        """
        Places the user in their personal room based on their user ID.
        """
        token = data.get("token")
        if not token:
            logger.warning(f"[Users] No token provided by SID: {sid}")
            return

        try:
            user_data = await get_current_user(token)
            user = user_data["user"]
        except Exception as e:
            logger.warning(f"[Users] Invalid token from {sid}: {e}")
            return

        await self.enter_room(sid, str(user.id))
        logger.info(f"[Users] User {user.id} joined room {user.id}")

    async def on_check_username_availability(self, sid, data):
        try:
            username = data.get("username")
            user_id = data.get("user_id")

            if not username or not user_id:
                logger.warning(f"[Users] Missing username or user_id from {sid}")
                return

            is_available = await self.user_service.check_username_availability(username, user_id)
            await self.emit(
                "check_username_availability",
                {"username": username, "available": is_available},
                room=sid,
            )
        except Exception as e:
            logger.exception(f"[UsersNamespace] Error: {e}")

    async def on_search_chef_suggestion(self, sid, data):
        try:
            token = data.get("token")
            search_val = data.get("search_val")
            return_unsimilar = data.get("return_unsimilar", False)

            if not search_val:
                logger.warning(f"[ChefSearch] Missing 'search_val' from SID: {sid}")
                return

            try:
                user_data = await get_current_user(token)
                user_id = user_data["user"].id
            except Exception:
                user_id = None  # allow anonymous search

            suggestions = await self.user_service.get_chefs(
                my_user_id=user_id, name=search_val
            )

            await self.emit("response_search_chef_suggestion", suggestions, room=sid)

        except Exception as e:
            logger.exception(f"[ChefSearch] Error: {e}")


class NotificationsNamespace(socketio.AsyncNamespace, AuthService):
    def __init__(self, namespace, user_service: AuthService):
        super().__init__(namespace)
        self.user_service = user_service

    async def on_connect(self, sid, environ):
        logger.info(f"[Notifications] Connected: {sid}")

    async def on_join_respective(self, sid, data):
        """
        Adds the client to a notifications room specific to their user ID.
        """
        token = data.get("token")
        if not token:
            logger.warning(f"[Notifications] No token provided by SID: {sid}")
            return

        try:
            user_data = await get_current_user(token)
            user = user_data["user"]
        except Exception as e:
            logger.warning(f"[Notifications] Invalid token from {sid}: {e}")
            return

        await self.enter_room(sid, str(user.id))
        room_id = await make_room_id(token)
        await self.enter_room(sid, room_id)

        await self.trigger_notification({
            "room": room_id,
            "message": "e-zed",
            "messageType": "success",
            "notification_name": "download_message"
        })


        logger.info(f"[Notifications] User {user.id} joined notifications room.{room_id}")

    async def trigger_notification(self, data: dict):
        """
        Emits a notification to a specific user's room.
        """
        logger.info("sending notification,%s to room %s",data.get('message'),data.get('room'))
        try:
            await self.emit(
                "download_message",
                {"message": data.get("message"), "messageType": data.get("messageType")},
                room=str(data["room"]),
            )
        except Exception as err:
            logger.exception(f"[Notifications] Failed to trigger notification: {err}")
