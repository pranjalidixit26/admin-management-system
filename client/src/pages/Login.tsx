import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';

export default function Login() {
    const [email, setEmail]=useState('');
    const [password, setPassword]=useState('');
    const [error, setError]=useState('');
    const navigate=useNavigate();

    const handleSubmit=async(e:React.FormEvent)=>{
        e.preventDefault();
        setError('');

        try{
            const response = await axios.post('http://localhost:3000/auth/login', {
                email,
                password,
            });

            localStorage.setItem('access_token', response.data.access_token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            navigate('/');
        } catch(err){
            setError('Invalid email or password');
        }
    };

    return(
        <div style={{display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh'}}>
            <form onSubmit={handleSubmit} style={{width:'300px'}}>
                <h2 style={{textAlign:'center', marginBottom:'20px'}}>Login</h2>

                {error && <p style ={{ color:'red'}}>{error}</p>}

                <div style={{marginBottom:'12px'}}>
                    <label>Email</label>
                    <br />
                    <input
                        type="email"
                        value={email}
                        onChange={(e)=>setEmail(e.target.value)}
                        style={{width:'100%', padding:'8px'}}
                    />
                </div>
                <div style={{marginBottom:'12px'}}>
                    <label>Password</label>
                    <br/>
                    <input
                        type="password"
                        value={password}
                        onChange={(e)=>setPassword(e.target.value)}
                        style={{width:'100%', padding:'8px'}}
                    />
                </div>

                <button type="submit" style={{width:'100%', padding:'10px'}}>
                    Login
                </button>
            </form>
        </div>
    );
}