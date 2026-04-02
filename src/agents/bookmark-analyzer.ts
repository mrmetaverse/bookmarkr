type BookmarkNode = chrome.bookmarks.BookmarkTreeNode

export type FlatBookmark = {
  id: string
  title: string
  url: string
  parentId: string
  parentTitle: string
}

export type ExistingFolder = {
  id: string
  title: string
  parentId?: string
}

export type BookmarkSnapshot = {
  flatBookmarks: FlatBookmark[]
  folders: ExistingFolder[]
  duplicateGroups: FlatBookmark[][]
}

function normalizeTitle(title: string): string {
  return title.trim().toLowerCase()
}

function rootFolderName(id: string): string {
  switch (id) {
    case '0':
      return 'Root'
    case '1':
      return 'Bookmarks Bar'
    case '2':
      return 'Other Bookmarks'
    case '3':
      return 'Mobile Bookmarks'
    default:
      return 'Folder'
  }
}

function flattenTree(
  node: BookmarkNode,
  parentTitle: string,
  folders: ExistingFolder[],
  bookmarks: FlatBookmark[],
): void {
  if (node.url) {
    bookmarks.push({
      id: node.id,
      title: node.title || '(Untitled)',
      url: node.url,
      parentId: node.parentId || '0',
      parentTitle,
    })
    return
  }

  folders.push({
    id: node.id,
    title: node.title || rootFolderName(node.id),
    parentId: node.parentId,
  })

  const nextParentTitle = node.title || rootFolderName(node.id)
  for (const child of node.children ?? []) {
    flattenTree(child, nextParentTitle, folders, bookmarks)
  }
}

function findDuplicateGroups(flatBookmarks: FlatBookmark[]): FlatBookmark[][] {
  const seen = new Map<string, FlatBookmark[]>()
  for (const bookmark of flatBookmarks) {
    const key = `${normalizeTitle(bookmark.title)}|${bookmark.url}`
    const group = seen.get(key) ?? []
    group.push(bookmark)
    seen.set(key, group)
  }

  return [...seen.values()].filter((group) => group.length > 1)
}

export async function buildBookmarkSnapshot(): Promise<BookmarkSnapshot> {
  const tree = await chrome.bookmarks.getTree()
  const root = tree[0]
  const folders: ExistingFolder[] = []
  const flatBookmarks: FlatBookmark[] = []

  flattenTree(root, 'Root', folders, flatBookmarks)

  return {
    flatBookmarks,
    folders,
    duplicateGroups: findDuplicateGroups(flatBookmarks),
  }
}
