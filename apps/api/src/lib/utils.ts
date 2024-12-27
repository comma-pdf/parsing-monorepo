function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0") // Add 1 to month as it's zero-indexed
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

export { formatDate }
