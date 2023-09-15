import axios from "axios";
import useSWR from "swr";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export const useGet = <T = any>(url: string) => useSWR<T>(url, fetcher);

// rome-ignore lint/suspicious/noExplicitAny: Suppressing this error because we are using any for the data
export const postJson = <R>(url: string, data: any) =>
	axios.post<R>(url, data).then((res) => res.data);
