import { Container, Group, Loader } from "@mantine/core";

export function LoadingState() {
  return (
    <Container size="lg" py="xl">
      <Group justify="center">
        <Loader size="lg" />
      </Group>
    </Container>
  );
}
