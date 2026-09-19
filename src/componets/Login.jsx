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
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

      const onLogIn = async (event) => {
        event?.preventDefault();
        const formData = {
            email:loginData.loginName,
            password:loginData.loginPassword
        }
        if (!formData.email.trim() || !formData.password) {
            setLoginError("Please enter your email and password.");
            return;
        }
        try {
            setIsLoggingIn(true);
            setLoginError("");
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
            console.error('login api error', e);
            setLoginError(
              e.response?.data?.message ||
              (e.request
                ? "Unable to reach the server. Please check your internet connection and try again."
                : "Login failed. Please try again.")
            );
        } finally {
            setIsLoggingIn(false);
        }
    }


  const onUserLoginChange = (e) => {
    const { name, value } = e.target;

    setLoginData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (loginError) setLoginError("");
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2 className="login-title">Log In</h2>

        <form className="login-form" onSubmit={onLogIn}>

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
            type="submit"
            className="login-button"
            disabled={isLoggingIn}
          >
            {isLoggingIn ? "Logging in..." : "Login"}
          </button>

          {loginError && (
            <p className="login-error" role="alert">
              {loginError}
            </p>
          )}
        </form>

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
