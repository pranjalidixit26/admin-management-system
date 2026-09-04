export default function Sidebar() {
    return (
        <aside style={{width: '220px', backgroundColor: '#1e293b' , color: 'white', padding: '20px'}}>
            <h2 style={{marginBottom: '20px'}}>Admin Panel</h2>
            <nav>
                <ul style={{listStyle: 'none', padding: 0}}>
                    <li style={{marginBottom: '10px'}}>Dashboard</li>
                    <li style={{marginBottom: '10px'}}>Users</li>
                    <li style={{marginBottom: '10px'}}>Roles</li>
                    <li style={{marginBottom: '10px'}}>Permissions</li>
                </ul>
            </nav>
        </aside>
    );
}