import { useState, useRef } from "react";
import { io } from "socket.io-client";
import _ from "lodash";

const SocketRow = ({ userId, orgIds, isPresenceVisible, deleteClient }) => {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(
    io("http://localhost:4000", {
      query: { userId, orgIds, isPresenceVisible },
      autoConnect: false,
    })
  );

  const connectSocket = () => {
    socketRef.current.connect();
    socketRef.current.on("connect", () => {
      setIsConnected(socketRef.current.connected);
    });
    socketRef.current.emit("getOnlineUsers", (data) => {
      setOnlineUsers(data);
    });

    socketRef.current.on("user-joined", ({ userId }) => {
      setOnlineUsers((prev) => _.uniq([...prev, userId]));
    });
    socketRef.current.on("user-left", ({ userId }) => {
      setOnlineUsers((prev) => prev.filter((id) => id !== userId));
    });
  };

  const disconnectSocket = () => {
    socketRef.current.disconnect();
    setOnlineUsers([]);
    setIsConnected(socketRef.current.connected);
  };

  return (
    <tr>
      <td>{userId}</td>
      <td>{JSON.stringify(orgIds)}</td>
      <td>{JSON.stringify(isPresenceVisible)}</td>
      <td>{JSON.stringify(onlineUsers)}</td>
      <td>
        {isConnected ? (
          <button onClick={disconnectSocket}>Disconnect</button>
        ) : (
          <button onClick={connectSocket}>Connect</button>
        )}
        <button onClick={deleteClient}>Delete</button>
      </td>
    </tr>
  );
};

function App() {
  const [clients, setClients] = useState([
    { userId: 1, orgIds: [1, 2], isPresenceVisible: true },
  ]);

  const addClient = () => {
    const userId = document.getElementById("userId").value;
    const orgIds = document
      .getElementById("orgIds")
      .value.split(",")
      .map(Number);
    const isPresenceVisible =
      document.getElementById("isPresenceVisible").checked;
    setClients((prev) => [...prev, { userId, orgIds, isPresenceVisible }]);
  };

  const deleteClient = (idx) => {
    setClients((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <main>
      <header>
        <div className="field">
          <label htmlFor="userId">User Id:</label>
          <input id="userId" placeholder="1" />
        </div>
        <div className="field">
          <label htmlFor="orgIds">Org Ids:</label>
          <input id="orgIds" placeholder="1,2" />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <label htmlFor="isConnected">Is Presence Visible:</label>
          <input type="checkbox" id="isPresenceVisible" />
        </div>
        <button onClick={addClient}>Generate Client</button>
      </header>
      <table>
        <thead>
          <tr>
            <th>UserId</th>
            <th>OrgIds</th>
            <th>Is Presence Visible</th>
            <th>Visible online users</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client, idx) => (
            <SocketRow
              key={`${client.userId}${idx}`}
              {...client}
              deleteClient={() => deleteClient(idx)}
            />
          ))}
        </tbody>
      </table>
    </main>
  );
}

export default App;
