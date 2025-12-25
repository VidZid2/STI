/**
 * useTodos Hook
 * Handles todo list state and persistence
 */

import { useState, useEffect, useRef } from 'react';
import type { TodoItem } from '../types';

interface UseTodosReturn {
    todos: TodoItem[];
    newTodoText: string;
    setNewTodoText: (text: string) => void;
    isAddingTodo: boolean;
    setIsAddingTodo: (adding: boolean) => void;
    todoInputRef: React.RefObject<HTMLInputElement | null>;
    addTodo: () => void;
    toggleTodo: (id: string) => void;
    deleteTodo: (id: string) => void;
    clearAllTodos: () => void;
    completedCount: number;
}

export const useTodos = (): UseTodosReturn => {
    // Load todos from localStorage on mount
    const [todos, setTodos] = useState<TodoItem[]>(() => {
        try {
            const saved = localStorage.getItem('dashboard-todos');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });
    const [newTodoText, setNewTodoText] = useState('');
    const [isAddingTodo, setIsAddingTodo] = useState(false);
    const todoInputRef = useRef<HTMLInputElement>(null);

    // Save todos to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('dashboard-todos', JSON.stringify(todos));
    }, [todos]);

    // Focus input when adding todo
    useEffect(() => {
        if (isAddingTodo && todoInputRef.current) {
            todoInputRef.current.focus();
        }
    }, [isAddingTodo]);

    const addTodo = () => {
        if (!newTodoText.trim()) return;
        const newTodo: TodoItem = {
            id: Date.now().toString(),
            text: newTodoText.trim(),
            completed: false,
            createdAt: new Date().toISOString()
        };
        setTodos(prev => [newTodo, ...prev]);
        setNewTodoText('');
        setIsAddingTodo(false);
    };

    const toggleTodo = (id: string) => {
        setTodos(prev => prev.map(todo =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
        ));
    };

    const deleteTodo = (id: string) => {
        setTodos(prev => prev.filter(todo => todo.id !== id));
    };

    const clearAllTodos = () => {
        setTodos([]);
    };

    const completedCount = todos.filter(t => t.completed).length;

    return {
        todos,
        newTodoText,
        setNewTodoText,
        isAddingTodo,
        setIsAddingTodo,
        todoInputRef,
        addTodo,
        toggleTodo,
        deleteTodo,
        clearAllTodos,
        completedCount,
    };
};

export default useTodos;
