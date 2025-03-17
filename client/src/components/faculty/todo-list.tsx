import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TodoItem {
  id: string;
  text: string;
  deadline: string;
  completed: boolean;
}

export function TodoList() {
  const [todos, setTodos] = useState<TodoItem[]>([
    {
      id: "1",
      text: "Chấm bài kiểm tra lớp CNTT2022",
      deadline: "Hôm nay",
      completed: false,
    },
    {
      id: "2",
      text: "Chuẩn bị bài giảng tuần sau",
      deadline: "18/11/2023",
      completed: false,
    },
    {
      id: "3",
      text: "Họp khoa CNTT",
      deadline: "20/11/2023 (14:00)",
      completed: false,
    },
    {
      id: "4",
      text: "Nộp đề thi cuối kỳ",
      deadline: "25/11/2023",
      completed: false,
    },
    {
      id: "5",
      text: "Gửi báo cáo nghiên cứu khoa học",
      deadline: "30/11/2023",
      completed: false,
    },
  ]);

  const [newTodo, setNewTodo] = useState({
    text: "",
    deadline: "",
  });

  const [open, setOpen] = useState(false);

  const handleToggleTodo = (id: string) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const handleAddTodo = () => {
    if (newTodo.text.trim()) {
      setTodos([
        ...todos,
        {
          id: Date.now().toString(),
          text: newTodo.text,
          deadline: newTodo.deadline || "Không có hạn chót",
          completed: false,
        },
      ]);
      setNewTodo({ text: "", deadline: "" });
      setOpen(false);
    }
  };

  return (
    <Card>
      <CardHeader className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
        <CardTitle className="text-base font-semibold">Việc cần làm</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-primary hover:text-primary"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm công việc mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="todo-text">Nội dung</Label>
                <Input
                  id="todo-text"
                  value={newTodo.text}
                  onChange={(e) =>
                    setNewTodo({ ...newTodo, text: e.target.value })
                  }
                  placeholder="Nhập công việc cần làm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="todo-deadline">Hạn chót</Label>
                <Input
                  id="todo-deadline"
                  value={newTodo.deadline}
                  onChange={(e) =>
                    setNewTodo({ ...newTodo, deadline: e.target.value })
                  }
                  placeholder="VD: 30/11/2023"
                />
              </div>
              <Button onClick={handleAddTodo} className="w-full">
                Thêm
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          {todos.map((todo) => (
            <div key={todo.id} className="flex items-center">
              <Checkbox
                id={`todo-${todo.id}`}
                checked={todo.completed}
                onCheckedChange={() => handleToggleTodo(todo.id)}
                className="h-4 w-4 text-primary border-gray-300 rounded mr-3"
              />
              <div className="flex-1">
                <label
                  htmlFor={`todo-${todo.id}`}
                  className={`block text-sm font-medium ${
                    todo.completed ? "line-through text-gray-400" : ""
                  }`}
                >
                  {todo.text}
                </label>
                <p
                  className={`text-xs ${
                    todo.deadline.includes("Hôm nay")
                      ? "text-red-500"
                      : "text-gray-500"
                  }`}
                >
                  Deadline: {todo.deadline}
                </p>
              </div>
            </div>
          ))}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="mt-4 text-xs text-gray-500 hover:text-gray-700 flex items-center"
        >
          <i className="ri-eye-line mr-1"></i> Xem tất cả nhiệm vụ
        </Button>
      </CardContent>
    </Card>
  );
}
