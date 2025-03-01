// import Pagination from "@/components/pagination";
// import Link from "next/link";
//
// type GameProp = {
//   id: number,
//   title: string,
//   attendance: number,
//   place: string,
//   type: string,
//   gameStartAt: string,
//   gameEndAt: string,
// }
//
// async function getData(page: number = 0) {
//   const res = await fetch(`${process.env.API_SERVER}/games?page=${page}`, {cache: "no-cache"});
//   return res.json();
// }
//
// export default async function GameList({searchParams}: {page: number}) {
//   const res = await getData(searchParams.page);
//   const contents: [GameProp] = res.content;
//
//   return (
//     <div>
//       <Link
//         type="button"
//         className="text-white bg-green bg-hover-green font-medium rounded-lg text-sm px-5 py-2.5"
//         href="/match"
//       >
//         경기 등록
//       </Link>
//       <table className="min-w-full divide-y divide-gray-800">
//         <thead className="bg-theme-color">
//         <tr>
//           <th className="px-6 py-3 text-center text-sm font-bold uppercase">
//             제목
//           </th>
//           <th className="px-6 py-3 text-center text-sm font-bold uppercase">
//             참가자 수
//           </th>
//           <th className="px-6 py-3 text-center text-sm font-bold uppercase">
//             종류
//           </th>
//           <th className="px-6 py-3 text-center text-sm font-bold uppercase">
//             장소
//           </th>
//           <th className="px-6 py-3 text-center text-sm font-bold uppercase">
//             경기 일정
//           </th>
//         </tr>
//         </thead>
//         <tbody className="bg-white divide-y divide-gray-200">
//         {contents.map((content: GameProp) => (
//             <tr key={content.id} className="hover:bg-gray-100">
//               <td className="px-6 py-4 whitespace-nowrap border-r border-gray-300 text-center">
//                 {content.title}
//               </td>
//               <td className="px-6 py-4 whitespace-nowrap border-r border-gray-300 text-center">
//                 {content.attendance ?? 0}
//               </td>
//               <td className="px-6 py-4 whitespace-nowrap border-r border-gray-300 text-center">
//                 {content.type}
//               </td>
//               <td className="px-6 py-4 whitespace-nowrap border-r border-gray-300 text-center">
//                 {content.place}
//               </td>
//               <td className="px-6 py-4 whitespace-nowrap text-center">
//                 {new Date(content.gameStartAt).toLocaleString('ko-KR')} ~ <br/> {new Date(content.gameEndAt).toLocaleString('ko-KR')}
//               </td>
//             </tr>
//         ))}
//         </tbody>
//       </table>
//       <Pagination totalPages={parseInt(res.totalPages)} totalElements={parseInt(res.totalElements)} nowPage={parseInt(res.number)}/>
//     </div>
//   );
// }
