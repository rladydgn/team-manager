import Pagination from "@/components/pagination";
import Link from "next/link";

export default function MatchList() {
  return (
    <div>
      <Link
        type="button"
        className="text-white bg-green bg-hover-green font-medium rounded-lg text-sm px-5 py-2.5"
        href="/match"
      >
        경기 등록
      </Link>
      <table className="min-w-full divide-y divide-gray-800">
        <thead className="bg-theme-color">
          <tr>
            <th className="px-6 py-3 text-center text-sm font-bold uppercase">
              제목
            </th>
            <th className="px-6 py-3 text-center text-sm font-bold uppercase">
              참가자 수
            </th>
            <th className="px-6 py-3 text-center text-sm font-bold uppercase">
              경기 일정
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {tempData.map((item) => (
            <tr key={item.id} className="hover:bg-gray-100">
              <td className="px-6 py-4 whitespace-nowrap border-r border-gray-300 text-center">
                {item.title}
              </td>
              <td className="px-6 py-4 whitespace-nowrap border-r border-gray-300 text-center">
                {item.attendance}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                {item.startDate} ~ <br /> {item.endDate}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination />
    </div>
  );
}

const tempData = [
  {
    id: "1",
    title: "아차산 배수지 체육공원 풋살장 6:6",
    attendance: 5,
    startDate: "2024-01-01 12:00:00",
    endDate: "2024-01-01 14:00:00",
  },
  {
    id: "2",
    title: "아차산 배수지 체육공원 풋살장 6:6",
    attendance: 5,
    startDate: "2024-01-01 12:00:00",
    endDate: "2024-01-01 14:00:00",
  },
  {
    id: "3",
    title: "아차산 배수지 체육공원 풋살장 6:6",
    attendance: 5,
    startDate: "2024-01-01 12:00:00",
    endDate: "2024-01-01 14:00:00",
  },
  {
    id: "4",
    title: "아차산 배수지 체육공원 풋살장 6:6",
    attendance: 5,
    startDate: "2024-01-01 12:00:00",
    endDate: "2024-01-01 14:00:00",
  },
];
