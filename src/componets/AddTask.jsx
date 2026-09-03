import { useState, useEffect } from 'react'
import api from '../api/api.js';
import { useNavigate } from 'react-router-dom';
import { useTask } from '../context/TaskContext.jsx'
const AddTask = () => {
    const naviagte = useNavigate();
    const { task, setTask } = useTask();
    const formatDateForInput = (isoDate) => {
    if (!isoDate) return '';
    return new Date(isoDate).toISOString().split('T')[0]; // "2026-08-28"
};
    useEffect(() => {
        // task && {}
        if(task){
            task.dueDate = formatDateForInput(task.dueDate);
             setFormData(task)
        }
        return () => {
            setTask(null)
        }
    }, [])

    const [formData, setFormData] = useState({
        id: '',
        title: '',
        description: '',
        status: "pending",
        priority: 'low',
        assignedTo: ''
    })
    const handleChange = (e) => {

        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
        console.log(formData)
    }
    const onSave = async () => {
// debugger
        if(formData._id){
             const res = await api.put('task/'+formData._id, formData);
              naviagte('/dash')
            return;
        }

        try {
            const res = await api.post('task/addTask', formData);
            const resData = res.data;
            console.log('success' + resData)
            naviagte('/dash')
        } catch (e) {
            console.log(e)
        }
    }
    const formRowStyle = {
        display: 'flex',
        alignItems: 'center',
        marginBottom: '10px'
    };

    const labelStyle = {
        width: '150px',      // fixed width keeps all inputs aligned in a column
        textAlign: 'right',
        marginRight: '10px'
    };

    const inputStyle = {
        flex: 1,              // input takes up remaining space
        padding: '4px 8px'
    };
    return (
        <div style={{ maxWidth: '400px' }}>
            <h1>Add Task</h1>
            <div style={formRowStyle}>
                <label style={labelStyle}>Title</label>
                <input style={inputStyle} type="text" value={formData.title} name="title" onChange={(e) => { handleChange(e) }} />
            </div>
            <div style={formRowStyle}>
                <label style={labelStyle}>description</label>
                <input style={inputStyle} type="text" value={formData.description} name="description" onChange={(e) => { handleChange(e) }} />
            </div>
            <div style={formRowStyle}>
                <label style={labelStyle}>status</label>
                <select style={inputStyle} value={formData.status} name="status" onChange={(e) => { handleChange(e) }}>
                    <option value="pending">pending</option>
                    <option value="in-progress">in-progress</option>
                    <option value="completed">completed</option>
                </select>
                {/* <input type="text" value={formData.status} name="status" onChange={(e)=>{handleChange(e)}} /> */}
            </div>
            <div style={formRowStyle}>
                <label style={labelStyle}>priority</label>
                <select style={inputStyle} value={formData.priority} name="priority" onChange={(e) => { handleChange(e) }} >
                    <option value="low">low</option>
                    <option value="medium">medium</option>
                    <option value="high">high</option>
                </select>
                {/* <input type="text" value={formData.priority} name="priority" onChange={(e)=>{handleChange(e)}} /> */}
            </div>
            <div style={formRowStyle}>
                <label style={labelStyle}>assignedTo</label>
                <input style={inputStyle} type="text" value={formData.assignedTo} name="assignedTo" onChange={(e) => { handleChange(e) }} />
            </div>
            <div style={formRowStyle}>
                <label style={labelStyle}>dueDate</label>
                <input style={inputStyle} type="date" value={formData.dueDate} name="dueDate" onChange={(e) => { handleChange(e) }} />
            </div>
            <button onClick={onSave}>Save</button>
        </div>
    )
}
export default AddTask;