import re

with open("src/pages/MockTestInterface.tsx", "r", encoding="utf-8") as f:
    code = f.read()

imports_patch = """import { 
  BookOpen, Clock, AlertTriangle, AlertCircle, Play, Pause, 
  RotateCcw, RefreshCw, LogOut, CheckCircle2, Maximize, Menu,
  X, Cloud, CloudOff, Plus, Minus, Search, ChevronRight, ChevronLeft, Check, Flag, Circle,
  ArrowLeft, Calendar, ShieldCheck
} from 'lucide-react';"""

code = re.sub(r'import {[^}]+} from \'lucide-react\';', imports_patch, code)

with open("src/pages/MockTestInterface.tsx", "w", encoding="utf-8") as f:
    f.write(code)

