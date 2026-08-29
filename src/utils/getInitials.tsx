export const getInitials = (text: string,count=2) => {
    if(!text) return ''
    return text
        .trim()
        .split(" ")
        .filter(Boolean)
        .map(word => word[0]?.toUpperCase())
        .join("")
        .slice(0,count)
}