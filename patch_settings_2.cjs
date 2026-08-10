const fs = require('fs');

let code = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

// Fix imports
code = code.replace(/import \{ useAuth, getAccessToken, signIn, signOut \} from '\.\.\/contexts\/AuthContext';/, "import { useAuth, getAccessToken } from '../contexts/AuthContext';");

// Fix variables
code = code.replace(/const \{ user \} = useAuth\(\);/, "const { user, signInWithGoogle, signOut } = useAuth();");

// Fix sign in button
code = code.replace(/onClick=\{signIn\}/, "onClick={signInWithGoogle}");

// Fix user info
code = code.replace(/<p className="font-medium text-\[var\(--color-on-surface\)\]">Signed in as \{user\.name\}<\/p>\s*<p className="text-sm text-\[var\(--color-on-surface-variant\)\] mt-1">\{user\.email\}<\/p>/, 
  '<p className="font-medium text-[var(--color-on-surface)]">Signed in as {user.displayName}</p>');

fs.writeFileSync('src/pages/Settings.tsx', code);
