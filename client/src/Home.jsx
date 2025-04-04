import React from 'react'

const Home = () => {
    const [users, setUsers] = useState([]);

	useEffect(() => {
		// fetch("https://test.arjansinghjassal.xyz/backend/api/chats") // API call to backend
			fetch("http://localhost:5000/api/chats") // API call to backend
			.then((response) => response.json())
			.then((data) => setUsers(data))
			.catch((error) => console.error("Error fetching chats:", error));
	}, []);

  return (
    <div>
        <h1>Home</h1>
        <div className='sidebar'>
            <nav>
                <ul>
                    {chats.map((chat) => (
                        <li key={chat.id}>{chat.name}</li>
                    ))}
                </ul>
            </nav>
        </div>
    </div>
  )
}

export default Home
