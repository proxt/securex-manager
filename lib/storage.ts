export interface User {
  id: number
  username: string
  password: string
  role: "admin" | "user"
  created_at: string
}

export interface Card {
  id: number
  title: string
  description?: string
  creator_id: number
  creator_name: string
  created_at: string
  updated_at: string
}

export interface CardItem {
  id: number
  card_id: number
  type: "title" | "link" | "login" | "password" | "custom"
  label: string
  value: string
  custom_field?: string
  order_index: number
  created_at: string
}

export interface Task {
  id: number
  title: string
  description?: string
  status: "pending" | "in-progress" | "completed" | "cancelled"
  priority: "low" | "medium" | "high"
  due_date?: string
  assigned_to?: number
  assignee_name?: string
  creator_id: number
  creator_name: string
  card_id?: number
  card_title?: string
  created_at: string
  updated_at: string
}

function initializeStorage() {
  if (typeof window === "undefined") return

  const users = localStorage.getItem("users")
  if (!users) {
    const defaultAdmin: User = {
      id: 1,
      username: "PROXT",
      password: "32Ipubib5429",
      role: "admin",
      created_at: new Date().toISOString(),
    }
    localStorage.setItem("users", JSON.stringify([defaultAdmin]))
  }

  if (!localStorage.getItem("cards")) {
    localStorage.setItem("cards", JSON.stringify([]))
  }

  if (!localStorage.getItem("cardItems")) {
    localStorage.setItem("cardItems", JSON.stringify([]))
  }

  if (!localStorage.getItem("tasks")) {
    localStorage.setItem("tasks", JSON.stringify([]))
  }

  if (!localStorage.getItem("nextId")) {
    localStorage.setItem(
      "nextId",
      JSON.stringify({
        user: 2,
        card: 1,
        cardItem: 1,
        task: 1,
      }),
    )
  }
}

export const storage = {
  init: initializeStorage,

  // Users
  getUsers: (): User[] => {
    if (typeof window === "undefined") return []
    return JSON.parse(localStorage.getItem("users") || "[]")
  },

  getUserById: (id: number): User | undefined => {
    return storage.getUsers().find((u) => u.id === id)
  },

  getUserByUsername: (username: string): User | undefined => {
    return storage.getUsers().find((u) => u.username === username)
  },

  createUser: (userData: Omit<User, "id" | "created_at">): User => {
    const users = storage.getUsers()
    const nextId = storage.getNextId()

    const newUser: User = {
      ...userData,
      id: nextId.user,
      created_at: new Date().toISOString(),
    }

    users.push(newUser)
    localStorage.setItem("users", JSON.stringify(users))

    nextId.user++
    localStorage.setItem("nextId", JSON.stringify(nextId))

    return newUser
  },

  updateUser: (id: number, userData: Partial<Omit<User, "id" | "created_at">>): User | null => {
    const users = storage.getUsers()
    const index = users.findIndex((u) => u.id === id)

    if (index === -1) return null

    users[index] = { ...users[index], ...userData }
    localStorage.setItem("users", JSON.stringify(users))

    return users[index]
  },

  deleteUser: (id: number): boolean => {
    const users = storage.getUsers()
    const filtered = users.filter((u) => u.id !== id)

    if (filtered.length === users.length) return false

    localStorage.setItem("users", JSON.stringify(filtered))
    return true
  },

  // Cards
  getCards: (): Card[] => {
    if (typeof window === "undefined") return []
    return JSON.parse(localStorage.getItem("cards") || "[]")
  },

  getCardById: (id: number): Card | undefined => {
    return storage.getCards().find((c) => c.id === id)
  },

  createCard: (cardData: Omit<Card, "id" | "created_at" | "updated_at">): Card => {
    const cards = storage.getCards()
    const nextId = storage.getNextId()

    const newCard: Card = {
      ...cardData,
      id: nextId.card,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    cards.push(newCard)
    localStorage.setItem("cards", JSON.stringify(cards))

    nextId.card++
    localStorage.setItem("nextId", JSON.stringify(nextId))

    return newCard
  },

  updateCard: (
    id: number,
    cardData: Partial<Omit<Card, "id" | "created_at" | "creator_id" | "creator_name">>,
  ): Card | null => {
    const cards = storage.getCards()
    const index = cards.findIndex((c) => c.id === id)

    if (index === -1) return null

    cards[index] = {
      ...cards[index],
      ...cardData,
      updated_at: new Date().toISOString(),
    }
    localStorage.setItem("cards", JSON.stringify(cards))

    return cards[index]
  },

  deleteCard: (id: number): boolean => {
    const cards = storage.getCards()
    const filtered = cards.filter((c) => c.id !== id)

    if (filtered.length === cards.length) return false

    // Also delete associated items
    const items = storage.getCardItems()
    const filteredItems = items.filter((i) => i.card_id !== id)
    localStorage.setItem("cardItems", JSON.stringify(filteredItems))

    localStorage.setItem("cards", JSON.stringify(filtered))
    return true
  },

  // Card Items
  getCardItems: (): CardItem[] => {
    if (typeof window === "undefined") return []
    return JSON.parse(localStorage.getItem("cardItems") || "[]")
  },

  getCardItemsByCardId: (cardId: number): CardItem[] => {
    return storage.getCardItems().filter((i) => i.card_id === cardId)
  },

  createCardItem: (itemData: Omit<CardItem, "id" | "created_at">): CardItem => {
    const items = storage.getCardItems()
    const nextId = storage.getNextId()

    const newItem: CardItem = {
      ...itemData,
      id: nextId.cardItem,
      created_at: new Date().toISOString(),
    }

    items.push(newItem)
    localStorage.setItem("cardItems", JSON.stringify(items))

    nextId.cardItem++
    localStorage.setItem("nextId", JSON.stringify(nextId))

    return newItem
  },

  updateCardItem: (id: number, itemData: Partial<Omit<CardItem, "id" | "card_id" | "created_at">>): CardItem | null => {
    const items = storage.getCardItems()
    const index = items.findIndex((i) => i.id === id)

    if (index === -1) return null

    items[index] = { ...items[index], ...itemData }
    localStorage.setItem("cardItems", JSON.stringify(items))

    return items[index]
  },

  deleteCardItem: (id: number): boolean => {
    const items = storage.getCardItems()
    const filtered = items.filter((i) => i.id !== id)

    if (filtered.length === items.length) return false

    localStorage.setItem("cardItems", JSON.stringify(filtered))
    return true
  },

  // Tasks
  getTasks: (): Task[] => {
    if (typeof window === "undefined") return []
    return JSON.parse(localStorage.getItem("tasks") || "[]")
  },

  getTaskById: (id: number): Task | undefined => {
    return storage.getTasks().find((t) => t.id === id)
  },

  createTask: (taskData: Omit<Task, "id" | "created_at" | "updated_at">): Task => {
    const tasks = storage.getTasks()
    const nextId = storage.getNextId()

    const newTask: Task = {
      ...taskData,
      id: nextId.task,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    tasks.push(newTask)
    localStorage.setItem("tasks", JSON.stringify(tasks))

    nextId.task++
    localStorage.setItem("nextId", JSON.stringify(nextId))

    return newTask
  },

  updateTask: (
    id: number,
    taskData: Partial<Omit<Task, "id" | "created_at" | "creator_id" | "creator_name">>,
  ): Task | null => {
    const tasks = storage.getTasks()
    const index = tasks.findIndex((t) => t.id === id)

    if (index === -1) return null

    tasks[index] = {
      ...tasks[index],
      ...taskData,
      updated_at: new Date().toISOString(),
    }
    localStorage.setItem("tasks", JSON.stringify(tasks))

    return tasks[index]
  },

  deleteTask: (id: number): boolean => {
    const tasks = storage.getTasks()
    const filtered = tasks.filter((t) => t.id !== id)

    if (filtered.length === tasks.length) return false

    localStorage.setItem("tasks", JSON.stringify(filtered))
    return true
  },

  // Helper
  getNextId: () => {
    return JSON.parse(localStorage.getItem("nextId") || '{"user":2,"card":1,"cardItem":1,"task":1}')
  },
}

// Auto-initialize on import
if (typeof window !== "undefined") {
  storage.init()
}
