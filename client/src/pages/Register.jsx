// import { useEffect } from 'react'
// import apiFetch from '../services/api';

// function Register(){
//     useEffect(() => {
//         apiFetch("/scholarships")
//             .then((data) => console.log("Got data:", data))
//             .catch((err) => console.error("Error: ", err));
//     }, []);
//     return <h1>Register Page</h1>;
// }

// export default Register;

import { useEffect } from 'react'
import apiFetch from '../services/api'

function Register() {
  useEffect(() => {
    apiFetch("/scholarships")
      .then((data) => console.log("Got data:", data))
      .catch((err) => console.error("Error:", err));
  }, []);

  return <h1>Register Page</h1>;
}

export default Register;