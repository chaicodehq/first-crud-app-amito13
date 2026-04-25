import { Todo } from "../models/todo.model.js";

/**
 * TODO: Create a new todo
 * - Extract data from req.body
 * - Create todo in database
 * - Return 201 with created todo
 */
export async function createTodo(req, res, next) {
  try {
    const { title: rawTitle, priority, ...rest } = req.body;
    let title = rawTitle;

    
    if (!title) {
      return res.status(400).json({
        error: { message: "Title is required" }
      });
    }

    
    title = title.trim();

    if (title.length < 3 || title.length > 120) {
      return res.status(400).json({
        error: { message: "Title must be between 3 and 120 characters" }
      });
    }

    const allowed = ["low", "medium", "high"];
    const normalizedPriority = priority ?? "medium";

    if (!allowed.includes(normalizedPriority)) {
      return res.status(400).json({
        error: { message: "Invalid priority" }
      });
    }

    const todo = await Todo.create({
      title,
      priority: normalizedPriority,
      ...rest
    });

    res.status(201).json(todo);

  } catch (err) {
    next(err);
  }
}

/**
 * TODO: List todos with pagination and filters
 * - Support query params: page, limit, completed, priority, search
 * - Default: page=1, limit=10
 * - Return: { data: [...], meta: { total, page, limit, pages } }
 */
export async function listTodos(req, res, next) {
  try {
    let { page = 1, limit = 10, completed, priority, search } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const filters = {};

    if (completed !== undefined) {
      filters.completed = completed === "true";
    }

   if (priority) {
      filters.priority = priority;
    }

   if (search) {
      filters.title = { $regex: search, $options: "i" };
    }

    const total = await Todo.countDocuments(filters);

    const pages = Math.ceil(total / limit);

    const todos = await Todo.find(filters)
      .sort({ createdAt: -1 }) // 🔥 IMPORTANT
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      data: todos,
      meta: {
        total,
        page,
        limit,
        pages,
      },
    });

  } catch (error) {
    next(error);
  }
}

/**
 * TODO: Get single todo by ID
 * - Return 404 if not found
 */
export async function getTodo(req, res, next) {
  try {
    const { id } = req.params;
    const todo = await Todo.findById(id);

    if (!todo) {
      return res.status(404).json({
        error: { message: "Todo not found" }
      });
    }

    return res.status(200).json(todo);
  } catch (error) {
    next(error);
  }
}

/**
 * TODO: Update todo by ID
 * - Use findByIdAndUpdate with { new: true, runValidators: true }
 * - Return 404 if not found
 */
export async function updateTodo(req, res, next) {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedTodo = await Todo.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedTodo) {
      return res.status(404).json({
        error: { message: "Todo not found" }
      });
    }

    return res.status(200).json(updatedTodo);
  } catch (error) {
    next(error);
  }
}

/**
 * TODO: Toggle completed status
 * - Find todo, flip completed, save
 * - Return 404 if not found
 */
export async function toggleTodo(req, res, next) {
  try {
    const { id } = req.params;
    const todo = await Todo.findById(id);

    if (!todo) {
      return res.status(404).json({
        error: { message: "Todo not found" }
      });
    }

    todo.completed = !todo.completed;
    await todo.save();

    return res.status(200).json(todo);
  } catch (error) {
    next(error);
  }
}

/**
 * TODO: Delete todo by ID
 * - Return 204 (no content) on success
 * - Return 404 if not found
 * - Note: Don't forget to handle invalid ID format (400) in error middleware! (CastError)
 * 
 */
export async function deleteTodo(req, res, next) {
  try {
    const { id } = req.params;

    const deletedTodo = await Todo.findByIdAndDelete(id);

    if (!deletedTodo) {
      return res.status(404).json({
        error: { message: "Todo not found" }
      });
    }

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
}
