import GameList from "@/components/gameList";

export default function Home({ searchParams }: {page: number}) {
  console.log(searchParams);
  return (
    <main>
      <GameList searchParams={searchParams} />
    </main>
  );
}
