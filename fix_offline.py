import re

with open("src/pages/MockTestInterface.tsx", "r", encoding="utf-8") as f:
    code = f.read()

old_offline = """{driveSyncStatus === 'offline' && <span className="text-amber-600 flex items-center gap-1"><CloudOff className="w-3 h-3"/> Offline</span>}"""
new_offline = """{driveSyncStatus === 'offline' && <span className="text-slate-600 flex items-center gap-1"><Check className="w-3 h-3"/> Saved</span>}"""

code = code.replace(old_offline, new_offline)

with open("src/pages/MockTestInterface.tsx", "w", encoding="utf-8") as f:
    f.write(code)

