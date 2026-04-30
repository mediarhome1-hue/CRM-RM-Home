import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Imoveis from '@/components/Imoveis';

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <Imoveis />
    </main>
  );
}
