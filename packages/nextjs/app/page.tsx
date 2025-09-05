"use client";

import { useEffect } from "react";
import { useState } from "react";
import type { NextPage } from "next";
import { parseEther } from "viem";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState<File>();
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const server = process.env.NEXT_PUBLIC_SERVER_URL;
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(null);

  const { writeContractAsync: writeYourContractAsync } = useScaffoldWriteContract({
    contractName: "YourContract",
  });

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleFileChange = (event: any) => {
    // Obtener el primer archivo seleccionado
    const file = event.target.files[0];
    console.log(file);
    setSelectedFile(file);
    if (file) {
      setActive(true);
    }
  };

  async function upload() {
    const url = "https://uploads.pinata.cloud/v3/files";
    const form = new FormData();
    form.append("network", "public");

    form.append("file", selectedFile as Blob, selectedFile?.name);

    const options = {
      method: "POST",
      headers: {
        Authorization: "Bearer " + process.env.NEXT_PUBLIC_PINATA_JWT,
      },
      body: form,
    };

    //options.body = form;

    try {
      setLoading(true);
      const response = await fetch(url, options);
      const data = await response.json();
      console.log(data);
      const resp = uploadMetadataToPinata(data.data.cid, data.data.name.replace(/\.jpg$/, ".json"), "test");
      // try {
      //   await writeYourContractAsync({
      //     functionName: "safeMint",
      //       args: ["adrress",resp],
      //     });
      //     } catch (e) {
      //        console.error("Error mint image:", e);
      //     }
      console.log(resp);
      setMessage("¡Imagen subida exitosamente!");
      setMessageType("success");
      setLoading(false);
    } catch (error) {
      setMessage("Error al subir la imagen.");
      setMessageType("error");
      console.error(error);
      setLoading(false);
    }
  }

  const options = {
    method: "GET",
    headers: {
      Authorization: "Bearer " + process.env.NEXT_PUBLIC_PINATA_JWT,
    },
  };

  async function uploadMetadataToPinata(imageHash: string, name: string, description: string) {
    const url = "https://api.pinata.cloud/pinning/pinJSONToIPFS";

    // Construye el objeto de metadatos
    const metadata = {
      pinataMetadata: {
        name: name,
        keyvalues: {
          // Puedes añadir metadatos adicionales
          creator: "CMM",
          project: "NFTMARKET",
        },
      },
      pinataContent: {
        description: description,
        image: server + imageHash,
        // más campos estándar de NFT
        name: "NFT de Prueba",
        attributes: [
          {
            trait_type: "Rareza",
            value: "Común",
          },
        ],
      },
    };

    const options = {
      method: "POST",
      headers: {
        Authorization: "Bearer " + process.env.NEXT_PUBLIC_PINATA_JWT,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(metadata), // Convierte el objeto a JSON
    };

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error de Pinata: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      console.log("Subida exitosa:", data);
      console.log("CID del JSON:", data.IpfsHash);

      return data.IpfsHash;
    } catch (error) {
      console.error("Error al subir archivo:", error);
      throw error;
    }
  }

  useEffect(() => {
    // This effect runs once when the component mounts
    const getFiles = () => {
      const url = "https://api.pinata.cloud/v3/files/public?mimeType=image/jpeg";
      fetch(url, options)
        .then(response => response.json())
        .then(response => {
          //filtrar solo jpg
          console.log(response);
          const images = response.data.files.filter((file: IPFSFile) => file.mime_type?.startsWith("image/"));
          console.log(images);
          setFiles(images);
          console.log(images);
        })
        .catch(err => console.error(err));
    };

    getFiles();
  }, []);

  return (
    <>
      Address:
      <Address address={connectedAddress}></Address>
      {message && (
        <div
          className={`
            fixed top-6 left-1/2 transform -translate-x-1/2 z-50
            px-6 py-3 rounded shadow-lg text-lg
            ${messageType === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"}
            animate-fade-in
    `}
          style={{ minWidth: "250px", textAlign: "center" }}
        >
          {message}
        </div>
      )}
      <div className="flex flex-col items-center justify-center gap-4 p-6 bg-base-200 rounded-xl shadow-md max-w-md mx-auto my-8">
        <h2 className="text-2xl font-bold text-primary mb-2">Subir NFT</h2>
        <input
          type="file"
          className="file-input file-input-bordered w-full max-w-xs"
          onChange={handleFileChange}
          disabled={loading}
        />
        <button className="btn btn-primary mt-2 w-full" onClick={() => upload()} disabled={!active || loading}>
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="loading loading-spinner loading-xs"></span>
              Cargando...
            </span>
          ) : (
            "UpLoad"
          )}
        </button>
        {loading && (
          <div className="flex items-center gap-2 text-primary mt-2">
            <span className="loading loading-spinner loading-md"></span>
            <span>Subiendo imagen, por favor espera...</span>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
        {files.map((file: IPFSFile) => (
          <div className="bg-base-200 p-4 rounded-box" key={file.cid}>
            <div className="card bg-base-100 w-96 shadow-sm" key={file.cid}>
              {file.mime_type?.startsWith("image/") && (
                <>
                  <figure>
                    <img
                      src={`${server}/ipfs/${file.cid}`}
                      alt="Shoes"
                      className="object-cover w-full h-48" // Limita la altura y ajusta el ancho
                      style={{ maxHeight: "12rem" }} // Opcional: refuerza el límite de altura
                    />
                  </figure>
                  <div className="card-body">
                    <h2 className="card-title">{file.name.replace(/\.jpg$/, "")}</h2>
                    <div className="card-actions justify-end">
                      <button
                        className="btn btn-primary"
                        onClick={async () => {
                          try {
                            await writeYourContractAsync({
                              functionName: "buyImage",
                              args: [file.cid],
                              value: parseEther("0.01"),
                            });
                          } catch (e) {
                            console.error("Error buying image:", e);
                          }
                        }}
                      >
                        Buy
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};
export default Home;

interface IPFSFile {
  cid: string;
  mime_type?: string;
  name: string;
  size: number;
}
