#!/bin/bash

# Add local group and user
# Either use the LOCAL_USER/GROUP_ID if passed in at runtime or
# fallback

USER_NAME=${LOCAL_USER_NAME:user}
USER_ID=${LOCAL_USER_ID:-9001}
GROUP_NAME=${LOCAL_GROUP_NAME:user_group}
GROUP_ID=${LOCAL_GROUP_ID:-90010}

echo "Starting with user = $USER_NAME, UID = $USER_ID; group = $GROUP_NAME, GID = $GROUP_ID"
groupadd $GROUP_NAME -g $GROUP_ID
useradd --shell /bin/bash -u $USER_ID -o -c "" -m $USER_NAME -g $GROUP_ID

export HOME=/home/$USER_NAME
exec /usr/local/bin/gosu $USER_NAME "$@"
