import os
import re

def replace_in_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Replace import
    content = re.sub(
        r"import \{[^}]*saveSQLiteToDrive[^}]*\} from '../lib/sqliteDriveSync';",
        "import { saveToFirestore } from '../lib/firebaseSync';",
        content
    )
    
    # Replace usages
    # const token = getAccessToken();
    # saveSQLiteToDrive(token, useStore.getState(), ...);
    # To:
    # if (user) saveToFirestore(user.uid, useStore.getState());
    
    # Let's just replace `saveSQLiteToDrive(token, state, immediate)` with `if (user) saveToFirestore(user.uid, state)`
    # We might need to ensure `user` is available. All these components use `useAuth()`.
    
    # So replacing `saveSQLiteToDrive(...)`
    content = re.sub(
        r"saveSQLiteToDrive\s*\(\s*token\s*,\s*([^,]+),\s*(?:true|false)\s*\)",
        r"if (user) saveToFirestore(user.uid, \1)",
        content
    )

    content = re.sub(
        r"await\s+saveSQLiteToDrive\s*\(\s*token\s*,\s*([^,]+),\s*(?:true|false)\s*\)",
        r"if (user) await saveToFirestore(user.uid, \1)",
        content
    )
    
    # and remove `const token = getAccessToken();` where it's not used anymore
    content = re.sub(
        r"const token = getAccessToken\(\);\s*(if \(user\) saveToFirestore)",
        r"\1",
        content
    )

    with open(filepath, 'w') as f:
        f.write(content)

files = [
    'src/components/Header.tsx',
    'src/pages/Settings.tsx',
    'src/pages/MockTestInterface.tsx',
    'src/pages/TestDetails.tsx'
]

for file in files:
    if os.path.exists(file):
        replace_in_file(file)

