import {createContext, useState, useContext} from 'react';

const TaskContext  = createContext();
const TaskContextProvider = ({children})=>{
    const [task, setTask] = useState({})
    return(
    <TaskContext.Provider value={{task,setTask}}>
        {children}
    </TaskContext.Provider>
    )
}
const useTask = ()=> useContext(TaskContext);

export default TaskContextProvider;
export {useTask}