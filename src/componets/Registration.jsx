import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Registration.css";
import api from '../api/api.js';
const Registration = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const gotoLogin = () => {
    navigate("/");
  };

  const onInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
//     const onSubmit = async () => {
//         console.log(formData);
//         try {
//             const res = await api.post(
//                 'auth/registration',
//                 formData
//             )
//             // if(res.message=='success'){
//             navigate('/')
//             // }
//         } catch (e) {
//             console.log(e)
//         }
//     }
  const onSubmit = async (e) => {
    e.preventDefault();

        try {
        const res = await api.post(
            'auth/registration',
            formData
        )
        // if(res.message=='success'){
        navigate('/')
        // }
        } catch (e) {
        console.log(e)
        }

return
    console.log(formData);
 const API_URL = import.meta.env.VITE_API_URL;
    const url = `${API_URL}/api/register`;
  //  const url = "http://localhost:5000/api/register";

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      console.log(data);

      if (res.ok) {
        navigate("/");
      }
    } catch (error) {
      console.error("Registration error:", error);
    }
  };

  return (
    <div className="registration-page">
      <div className="registration-card">

        <h2 className="registration-title">
          Create Account
        </h2>

        <form onSubmit={onSubmit} className="registration-form">

          <div className="form-group">
            <label htmlFor="name">
              Name
            </label>

            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={onInputChange}
              placeholder="Enter  name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">
              Email
            </label>

            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={onInputChange}
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={onInputChange}
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            className="registration-button"
          >
            Create Account
          </button>

        </form>

        <div className="login-section">
          <span>
            Already have an account?
          </span>

          <button
            type="button"
            className="login-link-button"
            onClick={gotoLogin}
          >
            Go to Login
          </button>
        </div>

      </div>
    </div>
  );
};

export default Registration;


// import { useState } from 'react';
// import { useNavigate } from 'react-router-dom'

// import api from '../api/api.js';
// const Registration = () => {
//     const [formData, setFormData] = useState({
//         name: '',
//         email: '',
//         password: ''
//     })
//     const navigate = useNavigate();
//     const handleInputChange = (e) => {

//         setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
//     }
//     const onSubmit = async () => {
//         console.log(formData);
//         try {
//             const res = await api.post(
//                 'auth/registration',
//                 formData
//             )
//             // if(res.message=='success'){
//             navigate('/')
//             // }
//         } catch (e) {
//             console.log(e)
//         }
//     }
//     return (
//         <div style={{
//             display: 'flex',
//             flexDirection: 'column',
//             justifyContent: 'center',
//             alignItems: 'center'
//         }}>

//             <div>
//                 <label>Name</label>
//                 <input type="text" name="name" value={formData.name} onChange={(e) => { handleInputChange(e) }} />
//             </div>
//             <div>
//                 <label>Email</label>
//                 <input type="text" name="email" value={formData.email} onChange={(e) => { handleInputChange(e) }} />
//             </div>
//             <div>
//                 <label>Password</label>
//                 <input type="text" name="password" value={formData.password} onChange={(e) => { handleInputChange(e) }} />
//             </div>
//             <div>
//                 <button onClick={onSubmit}>Submit</button>
//             </div>
//         </div>
//     )
// }
// export default Registration;