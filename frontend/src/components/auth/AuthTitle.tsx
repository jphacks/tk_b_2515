type AuthTitleProps = {
  title: string;
  description: string;
};

export function AuthTitle({ title, description }: AuthTitleProps) {
  return (
    <div className="text-center space-y-2">
      <h1 className="text-3xl sm:text-4xl font-bold text-foreground">{title}</h1>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
