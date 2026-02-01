import { Alert, Container } from "@mantine/core";

interface Props {
  title: string;
  message: string;
  color?: string;
}

export function ErrorState({ title, message, color = "red" }: Props) {
  return (
    <Container size="lg" py="xl">
      <Alert color={color} title={title}>
        {message}
      </Alert>
    </Container>
  );
}
