import React, { useEffect, useRef, useState } from 'react'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  Image,
  Text,
  Box,
  Icon,
  Flex
} from '@chakra-ui/react'
import { Video } from 'youtube-sr'
import { FaDownload } from 'react-icons/fa'
import { videoFormat } from 'ytdl-core'

import FormatsDropdown from './FormatsDropdown'
import LoadingState from '../types/LoadingState'
import { fetchVideoFormats } from '../utils/formats'
import { useDownloader, useDownloadFormat, useDownloadStatus } from '../contexts/download'
import Progress from './Progress'
import usePrevious from '../hooks/usePrevious'

interface DownloadModalProps {
  video: Video
  isOpen: boolean
  onClose: () => void
}

const DownloadModal: React.FC<DownloadModalProps> = ({ video, isOpen, onClose }) => {
  const [selected, setSelected] = useState(0)
  const [formats, setFormats] = useState<LoadingState<videoFormat[]>>({
    data: [],
    loading: false
  })

  const wasOpened = usePrevious(isOpen)
  const loadingVideo = useRef<string | null>(null)

  const { download, stop } = useDownloader()
  const downloadStatus = useDownloadStatus(video.id!)
  const downloadFormat = useDownloadFormat(video.id!)

  useEffect(() => {
    const hasOpened = isOpen && !wasOpened
    if (hasOpened) {
      loadFormats()
      if (!downloadFormat) {
        setSelected(0)
      } else {
        fetchVideoFormats(video.id!).then((formats) => {
          const index = formats.indexOf(downloadFormat)
          setSelected(index)
        })
      }
    }
  })

  async function loadFormats() {
    setFormats({ data: [], loading: true })
    try {
      loadingVideo.current = video.id
      const data = await fetchVideoFormats(video.id!)
      if (loadingVideo.current === video.id) {
        setFormats({ data, loading: false })
      }
    } catch (err) {
      console.error(err)
    }
  }

  function handleClose() {
    loadingVideo.current = null
    setFormats({ data: [], loading: false })
    onClose()
  }

  async function handleDownload() {
    try {
      await download(video, formats.data[selected])
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered size="lg">
      <ModalOverlay />
      <ModalContent background="gray.900" color="gray.100">
        <ModalHeader>
          <Flex direction="row" align="center" justify="flex-start">
            <Icon as={FaDownload} marginRight="3" />
            Download Video
          </Flex>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Box position="relative">
            <Image
              src={video.thumbnail.url!}
              fit="cover"
              bgColor="gray.300"
              borderRadius="md"
            />

            <Text
              background="blackAlpha.800"
              fontWeight="bold"
              position="absolute"
              bottom="1"
              right="1"
              fontSize="smaller"
              borderRadius="md"
              paddingX="4px"
              textAlign="center"
            >
              {video.durationFormatted}
            </Text>
          </Box>

          <Text
            flex="1"
            isTruncated noOfLines={1}
            fontWeight="bold"
            marginTop="2"
            textAlign="center"
          >
            {video.title}
          </Text>

          <Progress
            videoId={video.id!}
            marginTop="2"
          />
        </ModalBody>

        <ModalFooter justifyContent="space-between">
          <FormatsDropdown
            formats={formats.data}
            selected={selected}
            setSelected={setSelected}
            isLoading={formats.loading}
            disabled={formats.loading || (downloadStatus !== null)}
          />

          <div>
            {!downloadStatus || (downloadStatus === 'starting') ? (
              <Button
                onClick={handleDownload}
                colorScheme="red"
                mr={3}
                isLoading={downloadStatus === 'starting'}
                disabled={formats.loading || !!downloadStatus}
              >
                Download
              </Button>
            ) : (
              <Button
                onClick={() => stop(video)}
                colorScheme="red"
                mr={3}
                disabled={downloadStatus !== 'downloading'}
              >
                Stop
              </Button>
            )}

            <Button
              onClick={onClose}
              variant="ghost"
              _hover={{
                background: 'gray.100',
                color: 'gray.700'
              }}
            >
              Close
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default DownloadModal
