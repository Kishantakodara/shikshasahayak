import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TeacherRoute from './TeacherRoute';
import * as AuthContext from '../../context/AuthContext';

// Mock the useAuth hook
vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockUseAuth = vi.mocked(AuthContext.useAuth);

describe('TeacherRoute', () => {
  const ProtectedContent = () => <div>Protected Teacher Content</div>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner when auth is loading', () => {
    mockUseAuth.mockReturnValue({
      currentUser: null,
      loading: true,
      loginWithGoogle: vi.fn(),
      loginWithEmail: vi.fn(),
      registerWithEmail: vi.fn(),
      loginMockUser: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <BrowserRouter>
        <TeacherRoute>
          <ProtectedContent />
        </TeacherRoute>
      </BrowserRouter>
    );

    expect(screen.getByText(/verifying authentication/i)).toBeInTheDocument();
  });

  it('redirects to /login when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      currentUser: null,
      loading: false,
      loginWithGoogle: vi.fn(),
      loginWithEmail: vi.fn(),
      registerWithEmail: vi.fn(),
      loginMockUser: vi.fn(),
      logout: vi.fn(),
    });

    const { container } = render(
      <BrowserRouter>
        <TeacherRoute>
          <ProtectedContent />
        </TeacherRoute>
      </BrowserRouter>
    );

    // When Navigate component renders, it doesn't render children
    expect(screen.queryByText('Protected Teacher Content')).not.toBeInTheDocument();
  });

  it('redirects to /dashboard when user is not a teacher', () => {
    mockUseAuth.mockReturnValue({
      currentUser: {
        uid: 'student123',
        id: 'student123',
        email: 'student@example.com',
        displayName: 'Student User',
        fullName: 'Student User',
        role: 'student',
      },
      loading: false,
      loginWithGoogle: vi.fn(),
      loginWithEmail: vi.fn(),
      registerWithEmail: vi.fn(),
      loginMockUser: vi.fn(),
      logout: vi.fn(),
    });

    const { container } = render(
      <BrowserRouter>
        <TeacherRoute>
          <ProtectedContent />
        </TeacherRoute>
      </BrowserRouter>
    );

    // When Navigate component renders, it doesn't render children
    expect(screen.queryByText('Protected Teacher Content')).not.toBeInTheDocument();
  });

  it('renders protected content when user has TEACHER role', () => {
    mockUseAuth.mockReturnValue({
      currentUser: {
        uid: 'teacher123',
        id: 'teacher123',
        email: 'teacher@example.com',
        displayName: 'Teacher User',
        fullName: 'Teacher User',
        role: 'TEACHER',
      },
      loading: false,
      loginWithGoogle: vi.fn(),
      loginWithEmail: vi.fn(),
      registerWithEmail: vi.fn(),
      loginMockUser: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <BrowserRouter>
        <TeacherRoute>
          <ProtectedContent />
        </TeacherRoute>
      </BrowserRouter>
    );

    expect(screen.getByText('Protected Teacher Content')).toBeInTheDocument();
  });

  it('handles case-insensitive role checking', () => {
    mockUseAuth.mockReturnValue({
      currentUser: {
        uid: 'teacher123',
        id: 'teacher123',
        email: 'teacher@example.com',
        displayName: 'Teacher User',
        fullName: 'Teacher User',
        role: 'teacher', // lowercase
      },
      loading: false,
      loginWithGoogle: vi.fn(),
      loginWithEmail: vi.fn(),
      registerWithEmail: vi.fn(),
      loginMockUser: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <BrowserRouter>
        <TeacherRoute>
          <ProtectedContent />
        </TeacherRoute>
      </BrowserRouter>
    );

    expect(screen.getByText('Protected Teacher Content')).toBeInTheDocument();
  });

  it('renders protected content when no hierarchy is required', () => {
    mockUseAuth.mockReturnValue({
      currentUser: {
        uid: 'teacher123',
        id: 'teacher123',
        email: 'teacher@example.com',
        displayName: 'Teacher User',
        fullName: 'Teacher User',
        role: 'TEACHER',
      },
      loading: false,
      loginWithGoogle: vi.fn(),
      loginWithEmail: vi.fn(),
      registerWithEmail: vi.fn(),
      loginMockUser: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <BrowserRouter>
        <TeacherRoute requiredHierarchy={undefined}>
          <ProtectedContent />
        </TeacherRoute>
      </BrowserRouter>
    );

    expect(screen.getByText('Protected Teacher Content')).toBeInTheDocument();
  });

  it('allows access when teacher has sufficient hierarchy level', () => {
    mockUseAuth.mockReturnValue({
      currentUser: {
        uid: 'teacher123',
        id: 'teacher123',
        email: 'teacher@example.com',
        displayName: 'HOD User',
        fullName: 'HOD User',
        role: 'TEACHER',
        teacher_hierarchy: 'HOD',
      } as any,
      loading: false,
      loginWithGoogle: vi.fn(),
      loginWithEmail: vi.fn(),
      registerWithEmail: vi.fn(),
      loginMockUser: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <BrowserRouter>
        <TeacherRoute requiredHierarchy="COURSE_COORDINATOR">
          <ProtectedContent />
        </TeacherRoute>
      </BrowserRouter>
    );

    expect(screen.getByText('Protected Teacher Content')).toBeInTheDocument();
  });

  it('blocks access when teacher has insufficient hierarchy level', () => {
    mockUseAuth.mockReturnValue({
      currentUser: {
        uid: 'teacher123',
        id: 'teacher123',
        email: 'teacher@example.com',
        displayName: 'Teacher User',
        fullName: 'Teacher User',
        role: 'TEACHER',
        teacher_hierarchy: 'TEACHER',
      } as any,
      loading: false,
      loginWithGoogle: vi.fn(),
      loginWithEmail: vi.fn(),
      registerWithEmail: vi.fn(),
      loginMockUser: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <BrowserRouter>
        <TeacherRoute requiredHierarchy="HOD">
          <ProtectedContent />
        </TeacherRoute>
      </BrowserRouter>
    );

    expect(screen.getByText(/insufficient permissions/i)).toBeInTheDocument();
    expect(screen.queryByText('Protected Teacher Content')).not.toBeInTheDocument();
  });
});
