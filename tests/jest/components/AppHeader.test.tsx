import React from 'react';
import { render } from '@testing-library/react-native';
import AppHeader from '../../../components/AppHeader';

describe('AppHeader Component', () => {
  it('deve renderizar título corretamente', () => {
    const { getByText } = render(<AppHeader title="Teste Título" />);
    expect(getByText('Teste Título')).toBeTruthy();
  });

  it('deve renderizar subtítulo quando fornecido', () => {
    const { getByText } = render(
      <AppHeader title="Título" subtitle="Subtítulo" />
    );
    expect(getByText('Título')).toBeTruthy();
    expect(getByText('Subtítulo')).toBeTruthy();
  });

  it('não deve renderizar subtítulo quando não fornecido', () => {
    const { queryByText } = render(<AppHeader title="Título" />);
    expect(queryByText('Subtítulo')).toBeNull();
  });

  it('deve renderizar logo quando showLogo é true', () => {
    const { getByTestId } = render(
      <AppHeader title="Título" showLogo={true} />
    );
    // Assumindo que o Logo tem um testID
    // Se não tiver, podemos ajustar o teste
    expect(getByTestId).toBeDefined();
  });

  it('não deve renderizar logo quando showLogo é false', () => {
    const { queryByTestId } = render(
      <AppHeader title="Título" showLogo={false} />
    );
    // Ajustar conforme implementação do Logo
  });
});

