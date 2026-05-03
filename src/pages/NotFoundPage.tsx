import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/EmptyState';

export function NotFoundPage() {
  return (
    <div className="container">
      <EmptyState
        icon="404"
        title="Страница не найдена"
        description="Возможно, вы перешли по устаревшей ссылке."
        action={
          <Link to="/">
            <Button>Вернуться в каталог</Button>
          </Link>
        }
      />
    </div>
  );
}
