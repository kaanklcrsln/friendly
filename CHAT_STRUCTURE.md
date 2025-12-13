// Firebase Chat Structure Guide

/*
DATABASE STRUCTURE:
==================

/chat
  /general
    {messageId}:
      - text: "message content"
      - userId: "user_uid"
      - userEmail: "user@email.com"
      - timestamp: "2024-12-13T..."
      - avatar: "url" (optional)
  
  /private
    /{conversationId}
      /messages
        {messageId}:
          - text: "message content"
          - userId: "user_uid"
          - userEmail: "user@email.com"
          - timestamp: "2024-12-13T..."
          - avatar: "url"
      
      /participants
        {userId}: true

/users
  /{userId}
    - email: "user@email.com"
    - displayName: "name"
    - friends:
        {friendId}: true
    - conversationIds:
        {conversationId}: true

SECURITY RULES:
===============

{
  "rules": {
    "chat": {
      "general": {
        ".read": "auth != null",
        ".write": "auth != null",
        "$messageId": {
          ".write": "root.child('chat/general').child($messageId).child('userId').val() === auth.uid || !data.exists()"
        }
      },
      "private": {
        "$conversationId": {
          ".read": "root.child('chat/private').child($conversationId).child('participants').child(auth.uid).exists()",
          ".write": "root.child('chat/private').child($conversationId).child('participants').child(auth.uid).exists()",
          "messages": {
            ".read": "root.child('chat/private').child($conversationId).child('participants').child(auth.uid).exists()",
            ".write": "root.child('chat/private').child($conversationId).child('participants').child(auth.uid).exists()",
            "$messageId": {
              ".write": "root.child('chat/private').child($conversationId).child('messages').child($messageId).child('userId').val() === auth.uid || !data.exists()"
            }
          },
          "participants": {
            ".read": "root.child('chat/private').child($conversationId).child('participants').child(auth.uid).exists()",
            ".write": false
          }
        }
      }
    },
    "users": {
      "$uid": {
        ".read": "auth != null",
        ".write": "$uid === auth.uid",
        "friends": {
          ".read": "auth != null",
          ".write": "$uid === auth.uid"
        }
      }
    }
  }
}

FRIEND SYSTEM:
==============
- Users can send friend requests
- Friends can have 1-on-1 private chats
- Conversation ID = alphabetically sorted [userId1, userId2].join('_')
- Both users must be friends to see private chat
*/
