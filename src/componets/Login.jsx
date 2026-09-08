import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import api from '../api/api.js';
const Login = () => {
  const navigate = useNavigate();

  const [loginData, setLoginData] = useState({
    loginName: "",
    loginPassword: "",
  });

      const onLogIn = async () => {
        const formData = {
            email:loginData.loginName,
            password:loginData.loginPassword
        }
        try {
            const res = await api.post(
                'auth/login',
                 formData
            )
            sessionStorage.setItem('token', res.data.token);
            sessionStorage.setItem('user', JSON.stringify(res.data.user));
            if(res.data.user.role =='admin' ||
               res.data.user.role =='distCoordinator' ||
               res.data.user.role =='superAdmin'
              ){
                navigate('/dash');
            }else{
                 navigate('/newUser');
            }
                
            console.log('login success'+res)
        } catch (e) {
            console.log('login api error')
        }
    }


  const onUserLoginChange = (e) => {
    const { name, value } = e.target;

    setLoginData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2 className="login-title">Log In</h2>

        <div className="login-form">

          <div className="form-group">
            <label htmlFor="loginName">Email</label>

            <input
              id="loginName"
              type="text"
              name="loginName"
              value={loginData.loginName}
              onChange={onUserLoginChange}
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="loginPassword">Password</label>

            <input
              id="loginPassword"
              type="password"
              name="loginPassword"
              value={loginData.loginPassword}
              onChange={onUserLoginChange}
              placeholder="Enter your password"
            />
          </div>

          <button
            className="login-button"
            onClick={onLogIn}
          >
            Login
          </button>

        </div>

        <div className="register-section">
          <button
            className="register-button"
            onClick={() => navigate("/reset-password")}
          >
            Reset Password
          </button>

          {/*
          <span>Don't have an account?</span>

          <button
            className="register-button"
            onClick={goToRegi}
          >
            Create Account
          </button>
          */}
        </div>

      </div>
    </div>
  );
};

export default Login;




// import { useNavigate } from 'react-router-dom'
// import { useState } from 'react'
// import api from '../api/api.js';
// const Login = () => {
//     const navigate = useNavigate();
//     const [formData, setFormData] = useState({
//         email: '',
//         password: ''
//     })
//     const handleInputChange = (e)=>{
//         setFormData(prev =>({...prev,[e.target.name]:e.target.value}))
//     }
//     const onLogin = async () => {
//         try {
//             const res = await api.post(
//                 'auth/login',
//                  formData
//             )
//             sessionStorage.setItem('token', res.data.token);
//             debugger
//             navigate('/dash');
//             console.log('login success'+res)
//         } catch (e) {
//             console.log('login api error')
//         }
//     }
//     return (
//         <div>
//             <div>
//                 <div>
//                     <label>Email</label>
//                     <input type="text" name="email" value={formData.email} onChange={(e) => { handleInputChange(e) }} />
//                 </div>
//                 <div>
//                     <label>Password</label>
//                     <input type="text" name="password" value={formData.password} onChange={(e) => { handleInputChange(e) }} />
//                 </div>
//                 <button onClick={onLogin}>Login</button>
//             </div>

//             <button onClick={() => { navigate('/regi') }}>Registration</button>
//         </div>
//     )
// }
// export default Login;
