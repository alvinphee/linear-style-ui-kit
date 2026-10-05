// Saves text as a file in the browser's downloads: "notes.md", "customers.csv".
// It builds a blob, clicks a temporary link, and frees the blob a moment later.
export function downloadText(fileName: string, text: string, type = 'text/plain') {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
