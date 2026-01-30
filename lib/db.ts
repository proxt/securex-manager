import mysql from "mysql2/promise"
import bcrypt from "bcryptjs"

// Demo mode flag - set to true when MySQL is not available
const DEMO_MODE = !process.env.DATABASE_HOST

// In-memory storage for demo mode
const demoData = {
  users: [
    {
      id: 1,
      username: "PROXT",
      password: bcrypt.hashSync("32Ipubib5429", 10),
      role: "admin",
      created_at: new Date().toISOString(),
    },
  ],
  cards: [] as any[],
  card_items: [] as any[],
  tasks: [] as any[],
  nextIds: { users: 2, cards: 1, card_items: 1, tasks: 1 },
}

// Mock database interface for demo mode
const demoDb = {
  async execute(sql: string, params?: any[]): Promise<[any[], any]> {
    const sqlLower = sql.toLowerCase().trim()
    
    // SELECT queries
    if (sqlLower.startsWith("select")) {
      if (sqlLower.includes("from users")) {
        if (sqlLower.includes("where username")) {
          const user = demoData.users.find(u => u.username === params?.[0])
          return [user ? [user] : [], null]
        }
        if (sqlLower.includes("where id")) {
          const user = demoData.users.find(u => u.id === Number(params?.[0]))
          return [user ? [{ ...user, password: undefined }] : [], null]
        }
        return [demoData.users.map(u => ({ ...u, password: undefined })), null]
      }
      
      if (sqlLower.includes("from cards")) {
        if (sqlLower.includes("where id")) {
          const card = demoData.cards.find(c => c.id === Number(params?.[0]))
          return [card ? [card] : [], null]
        }
        return [demoData.cards, null]
      }
      
      if (sqlLower.includes("from card_items")) {
        if (sqlLower.includes("where card_id")) {
          const items = demoData.card_items.filter(i => i.card_id === Number(params?.[0]))
          return [items.sort((a, b) => a.order_index - b.order_index), null]
        }
        if (sqlLower.includes("where id")) {
          const item = demoData.card_items.find(i => i.id === Number(params?.[0]))
          return [item ? [item] : [], null]
        }
        return [demoData.card_items, null]
      }
      
      if (sqlLower.includes("from tasks")) {
        if (sqlLower.includes("where id")) {
          const task = demoData.tasks.find(t => t.id === Number(params?.[0]))
          return [task ? [task] : [], null]
        }
        return [demoData.tasks, null]
      }
    }
    
    // INSERT queries
    if (sqlLower.startsWith("insert")) {
      if (sqlLower.includes("into users")) {
        const newUser = {
          id: demoData.nextIds.users++,
          username: params?.[0],
          password: params?.[1],
          role: params?.[2] || "user",
          created_at: new Date().toISOString(),
        }
        demoData.users.push(newUser)
        return [{ insertId: newUser.id }, null]
      }
      
      if (sqlLower.includes("into cards")) {
        const newCard = {
          id: demoData.nextIds.cards++,
          title: params?.[0],
          description: params?.[1],
          url: params?.[2],
          username: params?.[3],
          password: params?.[4],
          creator_id: params?.[5],
          creator_name: params?.[6],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        demoData.cards.push(newCard)
        return [{ insertId: newCard.id }, null]
      }
      
      if (sqlLower.includes("into card_items")) {
        const newItem = {
          id: demoData.nextIds.card_items++,
          card_id: params?.[0],
          type: params?.[1],
          label: params?.[2],
          value: params?.[3],
          order_index: params?.[4] || 0,
          created_at: new Date().toISOString(),
        }
        demoData.card_items.push(newItem)
        return [{ insertId: newItem.id }, null]
      }
      
      if (sqlLower.includes("into tasks")) {
        const newTask = {
          id: demoData.nextIds.tasks++,
          title: params?.[0],
          description: params?.[1],
          status: params?.[2] || "pending",
          priority: params?.[3] || "medium",
          due_date: params?.[4],
          assignee_id: params?.[5],
          assignee_name: params?.[6],
          card_id: params?.[7],
          creator_id: params?.[8],
          creator_name: params?.[9],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        demoData.tasks.push(newTask)
        return [{ insertId: newTask.id }, null]
      }
    }
    
    // UPDATE queries
    if (sqlLower.startsWith("update")) {
      if (sqlLower.includes("users set")) {
        const id = params?.[params.length - 1]
        const userIndex = demoData.users.findIndex(u => u.id === Number(id))
        if (userIndex !== -1) {
          if (sqlLower.includes("password")) {
            demoData.users[userIndex].username = params?.[0]
            demoData.users[userIndex].password = params?.[1]
            demoData.users[userIndex].role = params?.[2]
          } else {
            demoData.users[userIndex].username = params?.[0]
            demoData.users[userIndex].role = params?.[1]
          }
        }
        return [{ affectedRows: userIndex !== -1 ? 1 : 0 }, null]
      }
      
      if (sqlLower.includes("cards set")) {
        const id = params?.[params.length - 1]
        const cardIndex = demoData.cards.findIndex(c => c.id === Number(id))
        if (cardIndex !== -1) {
          demoData.cards[cardIndex].title = params?.[0]
          demoData.cards[cardIndex].description = params?.[1]
          demoData.cards[cardIndex].url = params?.[2]
          demoData.cards[cardIndex].username = params?.[3]
          demoData.cards[cardIndex].password = params?.[4]
          demoData.cards[cardIndex].updated_at = new Date().toISOString()
        }
        return [{ affectedRows: cardIndex !== -1 ? 1 : 0 }, null]
      }
      
      if (sqlLower.includes("card_items set")) {
        const id = params?.[params.length - 1]
        const itemIndex = demoData.card_items.findIndex(i => i.id === Number(id))
        if (itemIndex !== -1) {
          demoData.card_items[itemIndex].type = params?.[0]
          demoData.card_items[itemIndex].label = params?.[1]
          demoData.card_items[itemIndex].value = params?.[2]
          demoData.card_items[itemIndex].order_index = params?.[3]
        }
        return [{ affectedRows: itemIndex !== -1 ? 1 : 0 }, null]
      }
      
      if (sqlLower.includes("tasks set")) {
        const id = params?.[params.length - 1]
        const taskIndex = demoData.tasks.findIndex(t => t.id === Number(id))
        if (taskIndex !== -1) {
          demoData.tasks[taskIndex].title = params?.[0]
          demoData.tasks[taskIndex].description = params?.[1]
          demoData.tasks[taskIndex].status = params?.[2]
          demoData.tasks[taskIndex].priority = params?.[3]
          demoData.tasks[taskIndex].due_date = params?.[4]
          demoData.tasks[taskIndex].assignee_id = params?.[5]
          demoData.tasks[taskIndex].assignee_name = params?.[6]
          demoData.tasks[taskIndex].card_id = params?.[7]
          demoData.tasks[taskIndex].updated_at = new Date().toISOString()
        }
        return [{ affectedRows: taskIndex !== -1 ? 1 : 0 }, null]
      }
    }
    
    // DELETE queries
    if (sqlLower.startsWith("delete")) {
      if (sqlLower.includes("from users")) {
        const id = params?.[0]
        const initialLength = demoData.users.length
        demoData.users = demoData.users.filter(u => u.id !== Number(id))
        return [{ affectedRows: initialLength - demoData.users.length }, null]
      }
      
      if (sqlLower.includes("from cards")) {
        const id = params?.[0]
        const initialLength = demoData.cards.length
        demoData.cards = demoData.cards.filter(c => c.id !== Number(id))
        return [{ affectedRows: initialLength - demoData.cards.length }, null]
      }
      
      if (sqlLower.includes("from card_items")) {
        const id = params?.[0]
        const initialLength = demoData.card_items.length
        if (sqlLower.includes("card_id")) {
          demoData.card_items = demoData.card_items.filter(i => i.card_id !== Number(id))
        } else {
          demoData.card_items = demoData.card_items.filter(i => i.id !== Number(id))
        }
        return [{ affectedRows: initialLength - demoData.card_items.length }, null]
      }
      
      if (sqlLower.includes("from tasks")) {
        const id = params?.[0]
        const initialLength = demoData.tasks.length
        demoData.tasks = demoData.tasks.filter(t => t.id !== Number(id))
        return [{ affectedRows: initialLength - demoData.tasks.length }, null]
      }
    }
    
    return [[], null]
  },
}

// Create MySQL pool only if not in demo mode
let pool: mysql.Pool | null = null

if (!DEMO_MODE) {
  pool = mysql.createPool({
    host: process.env.DATABASE_HOST,
    port: Number.parseInt(process.env.DATABASE_PORT || "3306"),
    user: process.env.DATABASE_USER || "root",
    password: process.env.DATABASE_PASSWORD || "",
    database: process.env.DATABASE_NAME || "securex_manager",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  })
}

// Export the appropriate database interface
const db = DEMO_MODE ? demoDb : pool!

export default db
export { DEMO_MODE }
