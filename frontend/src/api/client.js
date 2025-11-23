import axios from 'axios'


const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://gentrification-dashboard-production.up.railway.app',
})


export default API