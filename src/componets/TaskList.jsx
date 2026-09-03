import api from '../api/api.js';
import {useTask} from '../context/TaskContext.jsx'
const TaskList = ({task, deleteTask, editTask})=>{
    const {setTask} = useTask();
    const handleDelete =async (id)=>{
        deleteTask(id)
      //  const res = await api.delete(`task/${id}`)
    }
    const handleEdit =(item)=>{
        editTask(item)
        // setTask(item)
    }
    return (
        <div>
            <table>
                  <thead>
                    <tr>
                        <th>title</th>
                        <th>description</th>
                        <th>status</th>
                        <th>priority</th>
                        <th>dueDate</th>
                         <th>Action</th>
                    </tr>
                </thead>
                 <tbody>
            {task.map(item=>(
                <tr key={item._id}>
                    <td>{item.title}</td>
                    <td>{item.description}</td>
                    <td>{item.status}</td>
                    <td>{item.priority}</td>
                    <td>{item.dueDate ? new Date(item.dueDate).toLocaleDateString() : '—'}</td>
                     <td>
                        <span><button onClick={()=>{handleDelete(item._id)}}>Delete</button></span>
                        <span><button onClick={()=>{handleEdit(item)}}>Edit</button></span>
                     </td>
                </tr>
            ))}
            </tbody>
            </table>
        </div>
    )
}
export default TaskList;