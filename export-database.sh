# Database Export Script
mongodump --db library_db --out ./database_backup

echo "Database exported to ./database_backup"
echo "To restore on another machine:"  
echo "mongorestore --db library_db ./database_backup/library_db"