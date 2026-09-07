interface User {
  id: number;
  name: string;
  email: string;
  status: boolean;
}

const mockUsers: User[] = [
  { id: 1, name: 'Test User', email: 'testuser@gmail.com', status: true },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: true },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: false },
];

export default function UsersTable() {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={{ textAlign: 'left', padding: '10px', borderBottom: '2px solid #e2e8f0' }}>Name</th>
          <th style={{ textAlign: 'left', padding: '10px', borderBottom: '2px solid #e2e8f0' }}>Email</th>
          <th style={{ textAlign: 'left', padding: '10px', borderBottom: '2px solid #e2e8f0' }}>Status</th>
          <th style={{ textAlign: 'left', padding: '10px', borderBottom: '2px solid #e2e8f0' }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {mockUsers.map((user) => (
          <tr key={user.id}>
            <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>{user.name}</td>
            <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>{user.email}</td>
            <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>
              {user.status ? 'Active' : 'Inactive'}
            </td>
            <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>
              <button style={{ marginRight: '8px' }}>Edit</button>
              <button>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}