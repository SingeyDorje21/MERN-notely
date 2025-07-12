export function formatDate(dateString) {
    return dateString.toLocaleDateString("en-US",{
        day:"numeric",
        month:"short",
        year:"numeric",
    })
}
