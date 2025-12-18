import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface LoginFormProps {
  onLoginSuccess: (success: boolean) => void;
}

export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (data: { username: string; password: string }) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        onLoginSuccess(true);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Invalid username or password');
        onLoginSuccess(false);
      }
    } catch {
      setError('An error occurred during login. Please try again.');
      onLoginSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5 rounded-lg"
    >
      {error && (
        <Alert variant="destructive" className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5" />
          <AlertTitle className="text-sm">{error}</AlertTitle>
        </Alert>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="username" className="text-sm font-medium">
          Username
        </Label>
        <Input
          id="username"
          placeholder="your_username"
          className="transition focus-visible:ring-2"
          {...register('username', { required: 'Username is required' })}
        />
        {errors.username && (
          <p className="text-xs text-red-500">
            {errors.username.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-sm font-medium">
          Password
        </Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          className="transition focus-visible:ring-2"
          {...register('password', { required: 'Password is required' })}
        />
        {errors.password && (
          <p className="text-xs text-red-500">
            {errors.password.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full font-medium tracking-wide"
        disabled={isLoading}
      >
        {isLoading ? 'Logging in…' : 'Sign in'}
      </Button>
    </form>
  );
}
