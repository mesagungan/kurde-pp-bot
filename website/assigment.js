let start = () => {
 APIgetAssigments({"aid": window.location.toString().split("=")[1]}).then(createPage)
}
let createPage = (array) => {
    let obj = array[0]
    document.getElementById("task-title").innerText = obj.title
    document.getElementById("task-description").innerText = obj.description
    document.getElementById("task-due").innerText = new Date(obj.due).toDateString()

}
let dashboardTasks = () => {
    APIgetAssigments({}).then((obj) => {
        obj.forEach(element => {
            let task = document.createElement('div');
            task.innerText = element.title + " " + element.subject + "  " + new Date(element.due).toDateString()
            document.getElementById('assigments-dash').append(task)
        })
    })
}