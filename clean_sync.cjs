const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Remove GlobalSync completely
code = code.replace(/const GlobalSync = \(\) => \{[\s\S]*?return null;\n\};\n/m, '');
code = code.replace(/<GlobalSync \/>\n/g, '');

// Clean AppLayout
const appLayoutOld = `const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const { tests, attempts, srsItems } = useStore();

  useEffect(() => {
    let isMounted = true;
    const initDrive = async () => {
      const token = getAccessToken();
      if (token && !hasLoaded) {
        setIsSyncing(true);
        await loadFromDrive(token);
        if (isMounted) {
          setIsSyncing(false);
          setHasLoaded(true);
        }
      } else if (!token) { 
         setHasLoaded(true); // Allow local usage or show empty if not logged in
      }
    };
    initDrive();
    
    return () => { isMounted = false; };
  }, [user]);

  // Sync to drive whenever store changes
  useEffect(() => {
    const token = getAccessToken();
    if (token && hasLoaded) {
      const state = useStore.getState();
      saveToDrive(token, state);
    }
  }, [tests, attempts, srsItems, hasLoaded]);`;

const appLayoutNew = `const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();`;

code = code.replace(appLayoutOld, appLayoutNew);

fs.writeFileSync('src/App.tsx', code);
