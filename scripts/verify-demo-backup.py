#!/usr/bin/env python3
"""Backup/restore drill against disposable fictional SQLite records only."""
from __future__ import annotations
import hashlib
import json
import sqlite3
import tempfile
from pathlib import Path

TABLES = ("records", "applications", "notifications", "selection_criteria", "metadata")

def snapshot(db: sqlite3.Connection) -> dict:
    return {name: db.execute(f'SELECT * FROM "{name}" ORDER BY 1').fetchall() for name in TABLES}

def digest(rows: dict) -> str:
    return hashlib.sha256(json.dumps(rows,sort_keys=True,ensure_ascii=False).encode()).hexdigest()

def verify(db: sqlite3.Connection) -> None:
    assert db.execute("PRAGMA integrity_check").fetchone()[0]=="ok"

def main() -> None:
    # Intentionally accepts no database path; cannot export existing user data.
    with tempfile.TemporaryDirectory(prefix="coded-hub-fictitious-backup-") as temp:
        root=Path(temp)
        original=root/"original.sqlite"
        backup=root/"backup.sqlite"
        restored=root/"restored.sqlite"
        with sqlite3.connect(original) as source:
            source.executescript("""
                PRAGMA journal_mode=WAL;
                CREATE TABLE records(collection TEXT NOT NULL,id TEXT NOT NULL,json TEXT NOT NULL,PRIMARY KEY(collection,id));
                CREATE TABLE applications(id TEXT PRIMARY KEY,meeting_id TEXT NOT NULL,user_id TEXT NOT NULL,
                 status TEXT NOT NULL CHECK(status IN ('pending','confirmed','not_selected','withdrawn')),
                 requested_at TEXT NOT NULL,updated_at TEXT NOT NULL,UNIQUE(meeting_id,user_id));
                CREATE UNIQUE INDEX one_confirmed_star_per_meeting ON applications(meeting_id) WHERE status='confirmed';
                CREATE TABLE notifications(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,meeting_id TEXT NOT NULL,
                 title TEXT NOT NULL,body TEXT NOT NULL,created_at TEXT NOT NULL,read_at TEXT);
                CREATE TABLE selection_criteria(meeting_id TEXT PRIMARY KEY,text TEXT NOT NULL);
                CREATE TABLE metadata(key TEXT PRIMARY KEY,value TEXT NOT NULL);
            """)
            source.execute("INSERT INTO records VALUES(?,?,?)",("meetings","qa-meeting",json.dumps({"id":"qa-meeting","title":"JDP ficticia","joinUrl":"https://example.com/qa"})))
            source.execute("INSERT INTO applications VALUES(?,?,?,?,?,?)",("qa-application","qa-meeting","qa-star","confirmed","2026-11-23","2026-11-23"))
            source.execute("INSERT INTO notifications VALUES(?,?,?,?,?,?,?)",("qa-notice","qa-star","qa-meeting","Confirmado","Ejemplo","2026-11-23",None))
            source.execute("INSERT INTO selection_criteria VALUES(?,?)",("qa-meeting","Criterios ficticios"))
            source.execute("INSERT INTO metadata VALUES(?,?)",("seed-v3","qa-fixture"))
            source.commit()
            verify(source)
            expected=snapshot(source)
            with sqlite3.connect(backup) as out:
                source.backup(out)
        with sqlite3.connect(backup) as saved:
            verify(saved)
            assert digest(snapshot(saved))==digest(expected)
            with sqlite3.connect(restored) as target:
                saved.backup(target)
        with sqlite3.connect(restored) as recovery:
            verify(recovery)
            assert digest(snapshot(recovery))==digest(expected)
            try:
                recovery.execute("INSERT INTO applications VALUES(?,?,?,?,?,?)",
                                 ("duplicate","qa-meeting","another-qa-star","confirmed","2026-11-23","2026-11-23"))
            except sqlite3.IntegrityError:
                pass
            else:
                raise AssertionError("The one-confirmed-Star rule was not restored")
        print("BACKUP_RESTORE_OK: 5 tables and identical row checksums.")
        print("INTEGRITY_AND_UNIQUE_CONSTRAINT_OK")
        print("ONLY_FICTITIOUS_TEMPORARY_DATA_USED")

if __name__=="__main__":
    main()
