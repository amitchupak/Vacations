
# 1 create frontend env file (if missing):
copy .\Frontend\.env.example .\Frontend\.env

# 2 start everything (MongoDB persists automatically in ./Database/mongo-data):
docker compose up -d --build

# Optional: if you run local MongoDB on localhost:27017 with existing vacations data,
# docker compose auto-syncs into Docker only when Docker DB is empty (first-time seed).
# Existing Docker data is kept, so edits/additions are not overwritten on restart.

# Users
admin
admin@example.com
1234

user
user@example.com
1234

