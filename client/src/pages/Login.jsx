import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiFetch from '../services/api';
import { getRoleFromToken } from '../services/auth';

//Login.jsx
function Login(){
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    async function handleSubmit(e){
        e.preventDefault();

        try {
            const data = await apiFetch("/auth/login", {
                method: "POST",
                body: JSON.stringify({ email, password })
            });

            localStorage.setItem("token", data.token);
            
            const role = getRoleFromToken(data.token);

            if(role === "student"){
                navigate("/my-tracker");
            } else if(role === "admin"){
                navigate("/admin/dashboard");
            }
        } catch (error) {
            console.error("Login failed:", error);
        }
    }
    return (
        <form onSubmit={handleSubmit}>
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}/>

            
            <label htmlFor="password">Password</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}/>

            <button type="submit">Login</button>
        </form>
    );
}

export default Login;  // "this file's ONE main thing is Login — no label needed"