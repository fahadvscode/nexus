import { useTwilioStore } from '../hooks/useTwilioStore';
import { useUserRole } from './UserRoleProvider';

const DebugInfo = () => {
  const {
    isCallInProgress,
    callStatus,
    activeCall,
    device,
    isInitializing,
    error: twilioError,
  } = useTwilioStore();

  const { getActiveProfile } = useUserRole();
  const userProfile = getActiveProfile();

  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      zIndex: 9999,
      fontSize: '12px',
      fontFamily: 'monospace',
      maxWidth: '400px',
      maxHeight: '90vh',
      overflowY: 'auto',
      border: '1px solid #444',
    },
    header: {
      fontSize: '16px',
      fontWeight: 'bold',
      marginBottom: '10px',
      borderBottom: '1px solid #444',
      paddingBottom: '5px',
      color: '#00ff00',
    },
    section: {
      marginBottom: '10px',
    },
    sectionTitle: {
      fontWeight: 'bold',
      color: '#00ffff',
      marginBottom: '5px',
    },
    pre: {
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-all',
      backgroundColor: '#111',
      padding: '5px',
      borderRadius: '4px',
    },
    value: {
        color: '#ffc107',
    },
    booleanTrue: {
        color: '#28a745',
        fontWeight: 'bold',
    },
    booleanFalse: {
        color: '#dc3545',
    },
  };
  
  const renderValue = (key: string, value: any) => {
    const isBoolean = typeof value === 'boolean';
    let displayValue;
    let style = styles.value;

    if (isBoolean) {
        displayValue = value ? 'true' : 'false';
        style = value ? styles.booleanTrue : styles.booleanFalse;
    } else if (value === null || value === undefined) {
        displayValue = 'null';
    } else if (typeof value === 'object') {
        displayValue = JSON.stringify(value, null, 2);
    } else {
        displayValue = String(value);
    }

    return (
        <div>
            <span>{key}: </span>
            <span style={style}>{displayValue}</span>
        </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>🐞 Debug Info</div>
      
      <div style={styles.section}>
        <div style={styles.sectionTitle}>User Info</div>
        {renderValue('Email', userProfile?.email)}
        {renderValue('Role', userProfile?.role)}
        {renderValue('Is Active', userProfile?.is_active)}
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Twilio Store</div>
        {renderValue('isCallInProgress', isCallInProgress)}
        {renderValue('callStatus', callStatus)}
        {renderValue('isInitializing', isInitializing)}
        {renderValue('Device Ready', !!device)}
        {renderValue('Twilio Error', twilioError)}
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Active Call Details</div>
        {renderValue('Active Call Object', activeCall ? 'Exists' : 'null')}
        {activeCall && <pre style={styles.pre}>{JSON.stringify({ sid: (activeCall as any).parameters?.CallSid, status: activeCall.status() }, null, 2)}</pre>}
      </div>

    </div>
  );
};

export default DebugInfo; 